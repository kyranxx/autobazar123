#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_SAMPLE_ROUTE = "/audi/a1";

function printUsage() {
  console.log(`Usage: node scripts/check-vercel-ppr-lambda-blocker.mjs [--root=PATH] [--route=/audi/a1] [--expect-blocked]

Checks local .next build artifacts for the known Vercel static-PPR lambda lookup
failure signature:
- prerendered route renderingMode is PARTIALLY_STATIC
- routes-manifest PPR chain headers include next-resume=1

Default mode exits 1 when the blocker signature is present.
Use --expect-blocked when verifying the current known blocked state.
`);
}

export function parseArgs(argv) {
  const options = {
    root: process.cwd(),
    route: DEFAULT_SAMPLE_ROUTE,
    expectBlocked: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--expect-blocked") {
      options.expectBlocked = true;
      continue;
    }

    if (arg === "--root") {
      const root = argv[index + 1]?.trim();
      if (!root) {
        throw new Error("Invalid --root. Expected a non-empty path.");
      }
      options.root = path.resolve(root);
      index += 1;
      continue;
    }

    if (arg.startsWith("--root=")) {
      const root = arg.slice("--root=".length).trim();
      if (!root) {
        throw new Error("Invalid --root. Expected a non-empty path.");
      }
      options.root = path.resolve(root);
      continue;
    }

    if (arg === "--route") {
      const route = argv[index + 1]?.trim();
      if (!route?.startsWith("/")) {
        throw new Error("Invalid --route. Expected a route starting with /.");
      }
      options.route = route;
      index += 1;
      continue;
    }

    if (arg.startsWith("--route=")) {
      const route = arg.slice("--route=".length).trim();
      if (!route.startsWith("/")) {
        throw new Error("Invalid --route. Expected a route starting with /.");
      }
      options.route = route;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function buildRouteArtifactPath(root, route, extension) {
  const routeParts = route.replace(/^\/+/u, "").split("/").filter(Boolean);
  return path.join(root, ".next", "server", "app", ...routeParts) + extension;
}

function findSourcePagePath(root, appPathRoutesManifest, srcRoute) {
  const sourceKey = Object.entries(appPathRoutesManifest).find(
    ([key, route]) => route === srcRoute && key.endsWith("/page"),
  )?.[0];

  if (!sourceKey) {
    return {
      sourceKey: null,
      sourcePageJsPath: null,
      sourcePageJsExists: false,
    };
  }

  const sourcePageJsPath = path.join(
    root,
    ".next",
    "server",
    "app",
    ...sourceKey.replace(/^\/+/u, "").split("/"),
  ) + ".js";

  return {
    sourceKey,
    sourcePageJsPath,
    sourcePageJsExists: existsSync(sourcePageJsPath),
  };
}

function countPartiallyStaticRoutesBySource(prerenderManifest) {
  const counts = {};

  for (const [route, entry] of Object.entries(prerenderManifest.routes ?? {})) {
    if (entry.renderingMode !== "PARTIALLY_STATIC") {
      continue;
    }

    const source = entry.srcRoute ?? route;
    counts[source] = (counts[source] ?? 0) + 1;
  }

  return counts;
}

export function analyzeVercelPprLambdaBlocker({ root, route = DEFAULT_SAMPLE_ROUTE }) {
  const nextDir = path.join(root, ".next");
  const prerenderManifestPath = path.join(nextDir, "prerender-manifest.json");
  const routesManifestPath = path.join(nextDir, "routes-manifest.json");
  const appPathRoutesManifestPath = path.join(nextDir, "app-path-routes-manifest.json");
  const missingFiles = [
    prerenderManifestPath,
    routesManifestPath,
    appPathRoutesManifestPath,
  ].filter((filePath) => !existsSync(filePath));

  if (missingFiles.length > 0) {
    return {
      ok: false,
      blocked: false,
      missingFiles,
      route,
      partiallyStaticRouteCount: 0,
      partiallyStaticBySource: {},
      pprChainHeaders: null,
      hasNextResumeHeader: false,
      sample: null,
    };
  }

  const prerenderManifest = readJson(prerenderManifestPath);
  const routesManifest = readJson(routesManifestPath);
  const appPathRoutesManifest = readJson(appPathRoutesManifestPath);
  const partiallyStaticBySource = countPartiallyStaticRoutesBySource(prerenderManifest);
  const partiallyStaticRouteCount = Object.values(partiallyStaticBySource).reduce(
    (total, count) => total + count,
    0,
  );
  const pprChainHeaders = routesManifest.ppr?.chain?.headers ?? null;
  const hasNextResumeHeader = pprChainHeaders?.["next-resume"] === "1";
  const routeEntry = prerenderManifest.routes?.[route] ?? null;
  const sourceArtifacts = routeEntry?.srcRoute
    ? findSourcePagePath(root, appPathRoutesManifest, routeEntry.srcRoute)
    : {
        sourceKey: null,
        sourcePageJsPath: null,
        sourcePageJsExists: false,
      };

  const sample = routeEntry
    ? {
        route,
        srcRoute: routeEntry.srcRoute ?? null,
        renderingMode: routeEntry.renderingMode ?? null,
        routeHtmlExists: existsSync(buildRouteArtifactPath(root, route, ".html")),
        routeMetaExists: existsSync(buildRouteArtifactPath(root, route, ".meta")),
        sourceKey: sourceArtifacts.sourceKey,
        sourcePageJsExists: sourceArtifacts.sourcePageJsExists,
      }
    : null;

  const blocked =
    hasNextResumeHeader &&
    partiallyStaticRouteCount > 0 &&
    (!sample || sample.renderingMode === "PARTIALLY_STATIC");

  return {
    ok: !blocked,
    blocked,
    missingFiles: [],
    route,
    partiallyStaticRouteCount,
    partiallyStaticBySource,
    pprChainHeaders,
    hasNextResumeHeader,
    sample,
  };
}

export function formatResult(result, root) {
  if (result.missingFiles.length > 0) {
    return [
      "vercel-ppr-lambda-blocker: MISSING_BUILD",
      `root=${root}`,
      "Run npm run build before this diagnostic.",
      ...result.missingFiles.map((filePath) => `missing=${filePath}`),
    ].join("\n");
  }

  const lines = [
    `vercel-ppr-lambda-blocker: ${result.blocked ? "BLOCKED" : "OK"}`,
    `root=${root}`,
    `sampleRoute=${result.route}`,
    `partiallyStaticRoutes=${result.partiallyStaticRouteCount}`,
    `pprChainHeaders=${JSON.stringify(result.pprChainHeaders ?? {})}`,
  ];

  if (result.sample) {
    lines.push(
      `sample.renderingMode=${result.sample.renderingMode}`,
      `sample.srcRoute=${result.sample.srcRoute}`,
      `sample.routeHtmlExists=${result.sample.routeHtmlExists}`,
      `sample.routeMetaExists=${result.sample.routeMetaExists}`,
      `sample.sourceKey=${result.sample.sourceKey}`,
      `sample.sourcePageJsExists=${result.sample.sourcePageJsExists}`,
    );
  } else {
    lines.push("sample=not-found-in-prerender-manifest");
  }

  const bySourceEntries = Object.entries(result.partiallyStaticBySource)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([source, count]) => `${source}:${count}`);

  lines.push(`partiallyStaticBySource=${bySourceEntries.join(",")}`);

  if (result.blocked) {
    lines.push(
      "Matches the known Vercel static-PPR lambda lookup blocker signature.",
      "Do not treat Vercel Preview packaging as ready until this check is OK or an explicit rendering tradeoff is approved.",
    );
  }

  return lines.join("\n");
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  const root = path.resolve(options.root);
  const result = analyzeVercelPprLambdaBlocker({
    root,
    route: options.route,
  });

  console.log(formatResult(result, root));

  if (options.expectBlocked) {
    if (!result.blocked) {
      process.exitCode = 1;
    }
    return;
  }

  if (!result.ok) {
    process.exitCode = 1;
  }
}

const entrypoint = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entrypoint === fileURLToPath(import.meta.url)) {
  main();
}
