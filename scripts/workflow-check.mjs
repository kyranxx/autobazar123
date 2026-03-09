import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const checks = [
  {
    file: ".github/pull_request_template.md",
    required: [
      "Done Criteria",
      "npm run test:model-check",
      "Relevant unit tests executed",
      "Relevant flow/smoke tests executed",
      "Threat Model / Security Review",
      "codex-security-threat-model.md",
      "Codex Security findings reviewed",
      "Scope Check",
    ],
  },
  {
    file: "docs/codex-workflow-checklist.md",
    required: [
      "Before Starting",
      "Prompt Contract Template",
      "During Implementation",
      "Before Marking Done",
      "test:model-check",
      "test:codex-cli-check",
      "test:agent-browser",
      "docs/codex-security-threat-model.md",
      "Codex Security",
    ],
  },
  {
    file: "docs/codex-resource-adoption.md",
    required: [
      "Adopted Now",
      "Prompt Contract Template",
      "Skill Adoption Gate",
      "test:model-check",
      "test:codex-cli-check",
      "Codex Security",
      "docs/codex-security-threat-model.md",
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
