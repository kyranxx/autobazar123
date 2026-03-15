import net from "node:net";
import { spawnSync } from "node:child_process";

const args = ["test", "db", ...process.argv.slice(2)];
const isWindows = process.platform === "win32";
const defaultDbPort = Number(process.env.SUPABASE_LOCAL_DB_PORT || "54322");
const probeCommand = isWindows ? "where.exe" : "which";
const globalSupabaseCommand = "supabase";
const npxCommand = isWindows ? "npx.cmd" : "npx";
const dbOnlyExcludes = [
  "gotrue",
  "realtime",
  "storage-api",
  "imgproxy",
  "kong",
  "mailpit",
  "postgrest",
  "postgres-meta",
  "studio",
  "edge-runtime",
  "logflare",
  "vector",
  "supavisor",
];

function hasGlobalSupabase() {
  const probe = spawnSync(probeCommand, [globalSupabaseCommand], {
    stdio: "ignore",
  });

  return probe.status === 0;
}

const command = hasGlobalSupabase() ? globalSupabaseCommand : npxCommand;
const commandArgs = hasGlobalSupabase() ? args : ["--yes", "supabase", ...args];
const useShell = isWindows && command === npxCommand;

function runSupabase(subcommandArgs, options = {}) {
  return spawnSync(
    command,
    hasGlobalSupabase() ? subcommandArgs : ["--yes", "supabase", ...subcommandArgs],
    {
      stdio: "inherit",
      shell: useShell,
      ...options,
    },
  );
}

function isUsingExplicitDbUrl(cliArgs) {
  return cliArgs.includes("--db-url");
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    const finish = (result) => {
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(1_000);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
    socket.connect(port, "127.0.0.1");
  });
}

if (!isUsingExplicitDbUrl(process.argv.slice(2))) {
  const localDbReady = await isPortOpen(defaultDbPort);
  if (!localDbReady) {
    console.log(`Local Supabase DB is not running on port ${defaultDbPort}. Starting local stack...`);
    const startResult = runSupabase(["start", "--exclude", dbOnlyExcludes.join(",")]);
    if (startResult.error) {
      console.error(`Failed to start local Supabase stack: ${startResult.error.message}`);
      process.exit(1);
    }
    if ((startResult.status ?? 1) !== 0) {
      process.exit(startResult.status ?? 1);
    }
  }

  console.log("Resetting local Supabase DB to checked-in migrations...");
  const resetResult = runSupabase(["db", "reset", "--local", "--no-seed"]);
  if (resetResult.error) {
    console.error(`Failed to reset local Supabase DB: ${resetResult.error.message}`);
    process.exit(1);
  }
  if ((resetResult.status ?? 1) !== 0) {
    process.exit(resetResult.status ?? 1);
  }
}

const result = runSupabase(args);

if (result.error) {
  console.error(`Failed to run Supabase DB tests: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
