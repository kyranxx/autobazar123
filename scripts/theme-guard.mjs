#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BRAND_THEME_PATH = path.join(ROOT, "src", "config", "theme-brand.json");
const GLOBAL_CSS_PATH = path.join(ROOT, "src", "app", "globals.css");
const LAYOUT_PATH = path.join(ROOT, "src", "app", "layout.tsx");
const TARGET_DIRECTORIES = [
  path.join(ROOT, "src", "app"),
  path.join(ROOT, "src", "components"),
];
const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".css"]);
const EXCLUDED_PATH_SEGMENTS = new Set([
  ".git",
  ".next",
  "node_modules",
  "output",
  "coverage",
  "dist",
  "build",
]);
const RAW_HEX_PATTERN = /#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b/gu;
const REQUIRED_TOKEN_MAP = {
  "--color-primary": "primary",
  "--color-primary-hover": "primaryHover",
  "--color-primary-foreground": "primaryForeground",
  "--color-accent": "accent",
  "--color-accent-hover": "accentHover",
  "--color-accent-foreground": "accentForeground",
  "--color-accent-subtle": "accentSubtle",
  "--color-background-muted": "softSurface",
  "--color-success": "success",
  "--color-error": "error",
};
const LAYOUT_RUNTIME_TOKEN_MAP = {
  "--color-border-focus": "primary",
  "--color-primary": "primary",
  "--color-primary-hover": "primaryHover",
  "--color-primary-foreground": "primaryForeground",
  "--color-accent": "accent",
  "--color-accent-hover": "accentHover",
  "--color-accent-foreground": "accentForeground",
  "--color-accent-subtle": "accentSubtle",
  "--color-digital": "primary",
};
const ALLOWED_RAW_HEX_BY_FILE = new Map([
  [
    "src/app/globals.css",
    new Set([
      "#FFFFFF",
      "#F3F7F2",
      "#111317",
      "#F8F8F8",
      "#1A1A1A",
      "#4A4A4A",
      "#5F5F5F",
      "#6F6F6F",
      "#E8E8E8",
      "#F2F2F2",
      "#D8D8D8",
      "#005C33",
      "#004726",
      "#E06E12",
      "#A84A0D",
      "#FDE2CC",
      "#E7F0EB",
      "#1F6D4A",
      "#EDF8F3",
      "#D14343",
      "#FDEAEA",
      "#C9922A",
      "#FDF6E8",
      "#FFF",
    ]),
  ],
  ["src/app/layout.tsx", new Set(["#FFFFFF", "#1E293B"])],
  ["src/app/icon.tsx", new Set(["#2563EB"])],
  ["src/components/AuthModal.tsx", new Set(["#4285F4", "#34A853", "#FBBC05", "#EA4335"])],
  ["src/components/SimpleMap.tsx", new Set(["#3B82F6"])],
  ["src/app/(site)/kontakt/page.tsx", new Set(["#1877F2"])],
]);

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function shouldSkipPath(filePath) {
  return filePath.split(path.sep).some((segment) => EXCLUDED_PATH_SEGMENTS.has(segment));
}

function collectFiles(directoryPath, results = []) {
  if (!fs.existsSync(directoryPath)) {
    return results;
  }

  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);
    if (shouldSkipPath(entryPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      collectFiles(entryPath, results);
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (TEXT_EXTENSIONS.has(extension) && !entry.name.includes(".test.")) {
      results.push(entryPath);
    }
  }

  return results;
}

function getHexToken(css, tokenName) {
  const escapedToken = tokenName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escapedToken}\\s*:\\s*(#[0-9a-fA-F]{6})\\s*;`));

  if (!match) {
    throw new Error(`theme-guard: unable to resolve "${tokenName}" from src/app/globals.css`);
  }

  return match[1].toUpperCase();
}

function getObjectPropertyExpression(content, propertyName) {
  const escapedProperty = propertyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = content.match(
    new RegExp(`["']${escapedProperty}["']\\s*:\\s*([^,\\r\\n]+)`, "u"),
  );

  if (!match) {
    throw new Error(`theme-guard: unable to resolve "${propertyName}" in runtime theme injection`);
  }

  return match[1].trim();
}

function checkThemeTokenSync(brandTheme, globalCss) {
  const failures = [];

  for (const [tokenName, themeKey] of Object.entries(REQUIRED_TOKEN_MAP)) {
    const expected = brandTheme[themeKey];
    const actual = getHexToken(globalCss, tokenName);
    if (actual !== expected.toUpperCase()) {
      failures.push(`${tokenName}: expected ${expected}, found ${actual}`);
    }
  }

  return failures;
}

function checkLayoutThemeSync(brandTheme, layoutContent) {
  const failures = [];

  for (const [tokenName, themeKey] of Object.entries(LAYOUT_RUNTIME_TOKEN_MAP)) {
    const actual = getObjectPropertyExpression(layoutContent, tokenName);
    const expected = `BRAND_THEME.${themeKey}`;
    if (actual !== expected) {
      failures.push(`${tokenName}: expected ${expected}, found ${actual}`);
    }
  }

  return failures;
}

function normalizeHex(value) {
  return value.toUpperCase();
}

function checkRawHexEscapes() {
  const failures = [];
  const files = TARGET_DIRECTORIES.flatMap((directory) => collectFiles(directory));

  for (const filePath of files) {
    const relativePath = path.relative(ROOT, filePath).replaceAll("\\", "/");
    const content = fs.readFileSync(filePath, "utf8");
    const uniqueMatches = [...new Set([...content.matchAll(RAW_HEX_PATTERN)].map((match) => normalizeHex(match[0])))];

    if (uniqueMatches.length === 0) {
      continue;
    }

    const allowedHexes = ALLOWED_RAW_HEX_BY_FILE.get(relativePath);
    if (!allowedHexes) {
      failures.push(`${relativePath}: ${uniqueMatches.join(", ")}`);
      continue;
    }

    const unexpectedHexes = uniqueMatches.filter((match) => !allowedHexes.has(match));
    if (unexpectedHexes.length > 0) {
      failures.push(`${relativePath}: unexpected ${unexpectedHexes.join(", ")}`);
    }
  }

  return failures;
}

function main() {
  const brandTheme = loadJson(BRAND_THEME_PATH);
  const globalCss = fs.readFileSync(GLOBAL_CSS_PATH, "utf8");
  const layoutContent = fs.readFileSync(LAYOUT_PATH, "utf8");

  const themeSyncFailures = checkThemeTokenSync(brandTheme, globalCss);
  const layoutSyncFailures = checkLayoutThemeSync(brandTheme, layoutContent);
  const rawHexFailures = checkRawHexEscapes();

  if (themeSyncFailures.length > 0) {
    console.error("theme-guard: shared brand tokens are out of sync:");
    for (const failure of themeSyncFailures) {
      console.error(`- ${failure}`);
    }
  }

  if (layoutSyncFailures.length > 0) {
    console.error("theme-guard: runtime layout theme injection drift detected:");
    for (const failure of layoutSyncFailures) {
      console.error(`- ${failure}`);
    }
  }

  if (rawHexFailures.length > 0) {
    console.error("theme-guard: raw hex colors detected outside the approved file/value allowlist:");
    for (const failure of rawHexFailures) {
      console.error(`- ${failure}`);
    }
  }

  if (themeSyncFailures.length > 0 || layoutSyncFailures.length > 0 || rawHexFailures.length > 0) {
    process.exit(1);
  }

  console.log("theme-guard: OK");
}

main();
