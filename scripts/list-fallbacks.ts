import { getAllFallbackPolicies } from "../src/lib/fallbacks/registry";

type CliOptions = {
  json: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { json: false };

  for (const arg of argv) {
    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelpAndExit(0);
    }

    printHelpAndExit(1, `Unknown argument: ${arg}`);
  }

  return options;
}

function printHelpAndExit(code: number, error?: string): never {
  if (error) {
    console.error(error);
    console.error("");
  }

  console.log("Usage: npm run list:fallbacks -- [--json]");
  console.log("");
  console.log("Options:");
  console.log("  --json    Print fallback registry as JSON.");
  console.log("  -h        Show help.");
  console.log("  --help    Show help.");

  process.exit(code);
}

function padRight(value: string, width: number): string {
  if (value.length >= width) return value;
  return value + " ".repeat(width - value.length);
}

function renderTable(): void {
  const rows = getAllFallbackPolicies()
    .slice()
    .sort((left, right) => left.key.localeCompare(right.key))
    .map((policy) => ({
      key: policy.key,
      criticality: policy.criticality,
      owner: policy.owner,
      threshold: `${policy.thresholdCount}/${policy.thresholdWindowMinutes}m`,
      reviewBy: policy.reviewBy,
    }));

  const headers = {
    key: "key",
    criticality: "criticality",
    owner: "owner",
    threshold: "threshold",
    reviewBy: "reviewBy",
  } as const;

  const widths = {
    key: Math.max(headers.key.length, ...rows.map((row) => row.key.length)),
    criticality: Math.max(
      headers.criticality.length,
      ...rows.map((row) => row.criticality.length),
    ),
    owner: Math.max(headers.owner.length, ...rows.map((row) => row.owner.length)),
    threshold: Math.max(
      headers.threshold.length,
      ...rows.map((row) => row.threshold.length),
    ),
    reviewBy: Math.max(headers.reviewBy.length, ...rows.map((row) => row.reviewBy.length)),
  };

  const headerLine = [
    padRight(headers.key, widths.key),
    padRight(headers.criticality, widths.criticality),
    padRight(headers.owner, widths.owner),
    padRight(headers.threshold, widths.threshold),
    padRight(headers.reviewBy, widths.reviewBy),
  ].join("  ");

  const separatorLine = [
    "-".repeat(widths.key),
    "-".repeat(widths.criticality),
    "-".repeat(widths.owner),
    "-".repeat(widths.threshold),
    "-".repeat(widths.reviewBy),
  ].join("  ");

  console.log(`Fallback registry entries: ${rows.length}`);
  console.log("");
  console.log(headerLine);
  console.log(separatorLine);

  for (const row of rows) {
    console.log(
      [
        padRight(row.key, widths.key),
        padRight(row.criticality, widths.criticality),
        padRight(row.owner, widths.owner),
        padRight(row.threshold, widths.threshold),
        padRight(row.reviewBy, widths.reviewBy),
      ].join("  "),
    );
  }
}

function main(argv: string[]): void {
  const options = parseArgs(argv);
  const policies = getAllFallbackPolicies()
    .slice()
    .sort((left, right) => left.key.localeCompare(right.key));

  if (options.json) {
    console.log(JSON.stringify(policies, null, 2));
    return;
  }

  renderTable();
}

main(process.argv.slice(2));
