import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const checks = [
  {
    file: ".github/pull_request_template.md",
    required: [
      "Done Criteria",
      "Relevant unit tests executed",
      "Relevant flow/smoke tests executed",
      "Threat Model / Security Review",
      "codex-security-threat-model.md",
      "Scope Check",
    ],
  },
  {
    file: "docs/codex-workflow-checklist.md",
    required: [
      "Before Starting",
      "During Implementation",
      "Before Marking Done",
      "Codex Security",
      "docs/codex-security-threat-model.md",
      "test:web-interface",
      "test:ui-quality-gate",
      "test:security:release-gate",
    ],
  },
  {
    file: "docs/codex-security-threat-model.md",
    required: [
      "What the system is designed to do",
      "Where the system is exposed",
      "Trust boundaries",
      "How to use this document in Codex Security",
    ],
  },
];

let hasError = false;

for (const check of checks) {
  const filePath = resolve(process.cwd(), check.file);
  const content = readFileSync(filePath, "utf8");

  for (const token of check.required) {
    if (!content.includes(token)) {
      console.error(`WORKFLOW CHECK FAILED: '${token}' missing in ${check.file}`);
      hasError = true;
    }
  }
}

if (hasError) {
  process.exit(1);
}

console.log("WORKFLOW CHECK OK: required checklist markers are present.");
