#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

function collectMarkdownFiles(dir, out = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      collectMarkdownFiles(fullPath, out);
      continue;
    }
    if (entry.toLowerCase().endsWith(".md")) {
      out.push(fullPath);
    }
  }
  return out;
}

export function validateSkillGraph(baseDir) {
  const absoluteBase = resolve(process.cwd(), baseDir);
  if (!existsSync(absoluteBase)) {
    return { errors: [`skill graph directory missing: ${baseDir}`] };
  }

  const files = collectMarkdownFiles(absoluteBase);
  const errors = [];
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;

  for (const file of files) {
    const content = readFileSync(file, "utf8");
    for (const match of content.matchAll(wikiLinkRegex)) {
      const linkTarget = match[1].trim();
      const targetFile = resolve(absoluteBase, `${linkTarget}.md`);
      if (!existsSync(targetFile)) {
        errors.push(`${file} -> missing wikilink target [[${linkTarget}]]`);
      }
    }
  }

  return { errors };
}

function main() {
  const baseDir = process.argv[2] || "skills-graph";
  const result = validateSkillGraph(baseDir);
  if (result.errors.length > 0) {
    for (const error of result.errors) {
      console.error(`SKILL GRAPH CHECK FAILED: ${error}`);
    }
    process.exit(1);
  }
  console.log("SKILL GRAPH CHECK: OK");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
