import { existsSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, relative } from "node:path";

const cwd = process.cwd();
const devOutputPath = join(cwd, ".next", "dev");
const relativeTarget = relative(cwd, devOutputPath);
const isWindows = process.platform === "win32";

function run(commandName, args) {
  return spawnSync(commandName, args, {
    cwd,
    shell: false,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
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
      "| Select-Object ProcessId, CommandLine",
      "| ConvertTo-Json -Compress",
    ].join(" ");

    const result = run("powershell", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      script,
    ]);

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

  const result = run("ps", ["-ax", "-o", "pid=,ppid=,command="]);

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

if (!relativeTarget || relativeTarget.startsWith("..")) {
  throw new Error(`Refusing to remove path outside project: ${devOutputPath}`);
}

if (existsSync(devOutputPath)) {
  const activeDevProcesses = getMatchingNextDevProcesses();
  if (activeDevProcesses.length > 0) {
    console.error(
      `Refusing to remove .next/dev while a Next dev server is running for this project. Stop PID(s): ${activeDevProcesses
        .map((entry) => entry.pid)
        .join(", ")}.`,
    );
    process.exit(1);
  }

  rmSync(devOutputPath, { recursive: true, force: true });
  console.log("Removed generated Next.js dev artifacts from .next/dev.");
}
