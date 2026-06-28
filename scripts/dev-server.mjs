import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const cwd = process.cwd();
const isWindows = process.platform === "win32";
const lockPath = join(cwd, ".next", "dev", "lock");
const command = process.argv[2] ?? "status";

function run(commandName, args, options = {}) {
  return spawnSync(commandName, args, {
    cwd,
    shell: false,
    encoding: "utf8",
    ...options,
  });
}

function normalizePathForMatch(value) {
  return value.replaceAll("\\", "/").toLowerCase();
}

function isCurrentProjectPath(commandLine) {
  const normalizedCommand = normalizePathForMatch(commandLine);
  const normalizedCwd = normalizePathForMatch(cwd);

  return normalizedCommand.includes(`${normalizedCwd}/`);
}

function isNextDevCliCommand(commandLine) {
  if (!commandLine) {
    return false;
  }

  const normalizedCommand = normalizePathForMatch(commandLine);
  return normalizedCommand.includes("/next/dist/bin/next");
}

function isNextStartServerCommand(commandLine) {
  return normalizePathForMatch(commandLine).includes(
    "/next/dist/server/lib/start-server.js",
  );
}

function isNextDevBuildCommand(commandLine) {
  return normalizePathForMatch(commandLine).includes("/.next/dev/build/");
}

function commandBelongsToCurrentProject(commandLine) {
  return Boolean(commandLine) && isCurrentProjectPath(commandLine);
}

function hasCurrentProjectNextDevAncestor(entry, processByPid) {
  const visited = new Set();
  let parentPid = entry.parentPid;

  while (parentPid && !visited.has(parentPid)) {
    visited.add(parentPid);
    const parent = processByPid.get(parentPid);
    if (!parent) {
      return false;
    }

    if (
      commandBelongsToCurrentProject(parent.commandLine) &&
      (isNextDevCliCommand(parent.commandLine) ||
        isNextDevBuildCommand(parent.commandLine))
    ) {
      return true;
    }

    parentPid = parent.parentPid;
  }

  return false;
}

function isRepoNextDevCommand(entry, processByPid) {
  const { commandLine } = entry;
  if (!commandLine) {
    return false;
  }

  if (
    commandBelongsToCurrentProject(commandLine) &&
    (isNextDevCliCommand(commandLine) || isNextDevBuildCommand(commandLine))
  ) {
    return true;
  }

  if (isNextStartServerCommand(commandLine)) {
    return hasCurrentProjectNextDevAncestor(entry, processByPid);
  }

  return false;
}

function getMatchingNextDevProcesses() {
  if (isWindows) {
    const script = [
      "Get-CimInstance Win32_Process",
      "| Select-Object ProcessId, ParentProcessId, CommandLine",
      "| ConvertTo-Json -Compress",
    ].join(" ");

    const result = run(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
      { stdio: ["ignore", "pipe", "pipe"] },
    );

    const stdout = result.stdout?.trim();
    if (!stdout) {
      return [];
    }

    const parsed = JSON.parse(stdout);
    const entries = Array.isArray(parsed) ? parsed : [parsed];
    const processes = entries
      .map((entry) => ({
        pid: Number(entry.ProcessId),
        parentPid: Number(entry.ParentProcessId),
        commandLine: String(entry.CommandLine ?? ""),
      }))
      .filter((entry) => Number.isInteger(entry.pid) && entry.pid > 0);
    const processByPid = new Map(
      processes.map((entry) => [entry.pid, entry]),
    );
    return processes.filter((entry) => isRepoNextDevCommand(entry, processByPid));
  }

  const result = run("ps", ["-ax", "-o", "pid=,ppid=,command="], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  const processes = (result.stdout ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d+)\s+(\d+)\s+(.*)$/);
      if (!match) return null;

      return {
        pid: Number(match[1]),
        parentPid: Number(match[2]),
        commandLine: match[3],
      };
    })
    .filter((entry) => entry && Number.isInteger(entry.pid));
  const processByPid = new Map(processes.map((entry) => [entry.pid, entry]));
  return processes.filter((entry) => isRepoNextDevCommand(entry, processByPid));
}

function killPid(pid) {
  if (isWindows) {
    run("taskkill", ["/PID", String(pid), "/F"], {
      stdio: ["ignore", "ignore", "ignore"],
    });
    return;
  }

  run("kill", ["-9", String(pid)], {
    stdio: ["ignore", "ignore", "ignore"],
  });
}

function clearLockIfSafe() {
  if (getMatchingNextDevProcesses().length > 0) {
    return false;
  }

  if (existsSync(lockPath)) {
    rmSync(lockPath, { force: true });
    return true;
  }

  return false;
}

function printStatus() {
  const processes = getMatchingNextDevProcesses();
  const hasLock = existsSync(lockPath);

  if (processes.length === 0) {
    console.log("No local next dev server is running for this repo.");
  } else {
    console.log(`Running local next dev process${processes.length === 1 ? "" : "es"}:`);
    for (const processInfo of processes) {
      console.log(`- PID ${processInfo.pid}`);
    }
  }

  console.log(`Lock file: ${hasLock ? "present" : "missing"}`);
}

function stopServer() {
  const processes = getMatchingNextDevProcesses();

  if (processes.length === 0) {
    const removedLock = clearLockIfSafe();
    console.log(
      removedLock
        ? "No running dev server found. Removed stale lock file."
        : "No running dev server found.",
    );
    return;
  }

  for (const processInfo of processes) {
    killPid(processInfo.pid);
  }

  const remaining = getMatchingNextDevProcesses();
  if (remaining.length > 0) {
    throw new Error(`Could not stop PID(s): ${remaining.map((entry) => entry.pid).join(", ")}`);
  }

  clearLockIfSafe();
  console.log("Stopped local next dev server and cleared any stale lock.");
}

function startServer() {
  const result = spawnSync("npm", ["run", "dev"], {
    cwd,
    shell: isWindows,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status ?? 0);
}

switch (command) {
  case "status":
    printStatus();
    break;
  case "stop":
    stopServer();
    break;
  case "restart":
    stopServer();
    startServer();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.error("Use one of: status, stop, restart");
    process.exit(1);
}
