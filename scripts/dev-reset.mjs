import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const isWindows = process.platform === "win32";
const dryRun = process.argv.includes("--dry-run");
const ensurePort3000 = process.argv.includes("--ensure-3000");
const cwd = process.cwd();
const lockPath = join(cwd, ".next", "dev", "lock");
const RETRY_ATTEMPTS = 3;
const RETRY_SLEEP_MS = 300;

function runStep(title, action) {
  process.stdout.write(`${title}... `);
  try {
    action();
    process.stdout.write("ok\n");
  } catch (error) {
    process.stdout.write("failed\n");
    throw error;
  }
}

function stopStaleNextDevProcesses() {
  if (isWindows) {
    const psScript = [
      "$repo = $args[0]",
      "Get-CimInstance Win32_Process",
      "| Where-Object {",
      "  $_.Name -eq 'node.exe' -and",
      "  $_.CommandLine -match 'next dev' -and",
      "  $_.CommandLine -match [Regex]::Escape($repo)",
      "}",
      "| ForEach-Object { Stop-Process -Id $_.ProcessId -Force }",
    ].join(" ");

    spawnSync(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", psScript, cwd],
      { stdio: "ignore" },
    );
    return;
  }

  spawnSync("pkill", ["-f", `next dev.*${cwd}`], { stdio: "ignore" });
}

function clearDevLockFile() {
  if (!existsSync(lockPath)) {
    return;
  }

  rmSync(lockPath, { force: true });
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function getWindowsPortOwners(port) {
  const psScript = [
    "$port = [int]$args[0]",
    "$owners = @()",
    "try {",
    "  $owners += @(Get-NetTCPConnection -LocalPort $port -ErrorAction Stop | Select-Object -ExpandProperty OwningProcess)",
    "} catch {}",
    "if (-not $owners -or $owners.Count -eq 0) {",
    "  $owners += @(netstat -ano -p tcp | Select-String (':' + $port) | ForEach-Object { ($_ -split '\\s+')[-1] })",
    "}",
    "$owners | Where-Object { $_ -match '^\\d+$' } | Sort-Object -Unique",
  ].join(" ");

  const result = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      psScript,
      String(port),
    ],
    { stdio: ["ignore", "pipe", "ignore"] },
  );

  const stdout = result.stdout?.toString() ?? "";
  return Array.from(
    new Set(
      stdout
        .split(/\r?\n/)
        .map((value) => Number.parseInt(value.trim(), 10))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );
}

function getPortOwners(port) {
  if (isWindows) {
    return getWindowsPortOwners(port);
  }

  const pidResult = spawnSync("sh", ["-lc", `lsof -ti tcp:${port}`], {
    stdio: ["ignore", "pipe", "ignore"],
  });
  const output = pidResult.stdout?.toString().trim() ?? "";
  if (!output) return [];

  return Array.from(
    new Set(
      output
        .split(/\s+/)
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );
}

function killPid(pid) {
  if (isWindows) {
    spawnSync("taskkill", ["/PID", String(pid), "/F"], { stdio: "ignore" });
    return;
  }

  spawnSync("kill", ["-9", String(pid)], { stdio: "ignore" });
}

function freePort3000() {
  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt += 1) {
    const owners = getPortOwners(3000);
    if (owners.length === 0) {
      return;
    }

    for (const pid of owners) {
      killPid(pid);
    }

    sleep(RETRY_SLEEP_MS);
  }

  const remainingOwners = getPortOwners(3000);
  if (remainingOwners.length > 0) {
    throw new Error(
      `Port 3000 is still occupied by PID(s): ${remainingOwners.join(", ")}.`,
    );
  }
}

function startDevServer() {
  const args = ensurePort3000
    ? ["run", "dev", "--", "--port", "3000"]
    : ["run", "dev"];

  const result = spawnSync("npm", args, {
    stdio: "inherit",
    cwd,
    shell: isWindows,
  });

  if (result.error) {
    const error = result.error;
    console.error("Failed to start dev server:", error);
    process.exit(1);
  }

  process.exit(result.status ?? 0);
}

runStep("Stopping stale next dev processes", stopStaleNextDevProcesses);
if (ensurePort3000) {
  runStep("Freeing port 3000", freePort3000);
}
runStep("Removing stale .next/dev/lock", clearDevLockFile);

if (dryRun) {
  const command = ensurePort3000 ? "npm run :reset" : "npm run dev:reset";
  console.log(`Dry run complete. Run \`${command}\` to execute fully.`);
  process.exit(0);
}

console.log("Starting fresh dev server...");
startDevServer();
