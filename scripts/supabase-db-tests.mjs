import { spawnSync } from "node:child_process";

const args = ["test", "db", ...process.argv.slice(2)];
const isWindows = process.platform === "win32";

const probe = spawnSync(
  isWindows ? "where" : "which",
  ["supabase"],
  {
    stdio: "ignore",
    shell: isWindows,
  },
);

if (probe.status !== 0) {
  console.error(
    "Supabase CLI is not installed or not on PATH. Install it first: https://supabase.com/docs/guides/cli",
  );
  process.exit(1);
}

const result = spawnSync(
  isWindows ? "supabase" : "supabase",
  args,
  {
    stdio: "inherit",
    shell: isWindows,
  },
);

if (result.error) {
  console.error(`Failed to run Supabase DB tests: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
